package com.example.backend.services;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.requests.admin.AdminBookUpsertRequest;
import com.example.backend.dto.responseModel.admin.AdminBookPageResponse;
import com.example.backend.dto.responseModel.admin.AdminBookResponse;
import com.example.backend.entities.Author;
import com.example.backend.entities.Book;
import com.example.backend.entities.Bookauthor;
import com.example.backend.entities.BookauthorId;
import com.example.backend.entities.Bookcategory;
import com.example.backend.entities.BookcategoryId;
import com.example.backend.entities.Category;
import com.example.backend.entities.Inventory;
import com.example.backend.entities.Publisher;
import com.example.backend.repositories.AuthorRepository;
import com.example.backend.repositories.BookAuthorRepository;
import com.example.backend.repositories.BookCategoryRepository;
import com.example.backend.repositories.BookRepository;
import com.example.backend.repositories.CategoriesRepository;
import com.example.backend.repositories.InventoryRepository;
import com.example.backend.repositories.PublisherRepository;

@Service
public class AdminBookManagementService {
    // --- ADMIN BOOK MANAGEMENT START: service layer for admin book CRUD/filter APIs ---
    private static final Pattern NON_ALNUM_PATTERN = Pattern.compile("[^a-z0-9]+", Pattern.CASE_INSENSITIVE);

    private final BookRepository bookRepository;
    private final CategoriesRepository categoriesRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final BookCategoryRepository bookCategoryRepository;
    private final BookAuthorRepository bookAuthorRepository;
    private final InventoryRepository inventoryRepository;

    public AdminBookManagementService(BookRepository bookRepository,
                                      CategoriesRepository categoriesRepository,
                                      AuthorRepository authorRepository,
                                      PublisherRepository publisherRepository,
                                      BookCategoryRepository bookCategoryRepository,
                                      BookAuthorRepository bookAuthorRepository,
                                      InventoryRepository inventoryRepository) {
        this.bookRepository = bookRepository;
        this.categoriesRepository = categoriesRepository;
        this.authorRepository = authorRepository;
        this.publisherRepository = publisherRepository;
        this.bookCategoryRepository = bookCategoryRepository;
        this.bookAuthorRepository = bookAuthorRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional
    public AdminBookResponse createBook(AdminBookUpsertRequest request) {
        Book book = new Book();
        Long nextBookId = bookRepository.findTopByOrderByIdDesc().map(Book::getId).orElse(0L) + 1L;
        book.setId(nextBookId);
        applyCommonFields(book, request);

        if (book.getCreatedAt() == null) {
            book.setCreatedAt(OffsetDateTime.now());
        }
        if (book.getSoldCount() == null) {
            book.setSoldCount(0);
        }
        if (book.getIsDeleted() == null) {
            book.setIsDeleted(false);
        }

        Book savedBook = bookRepository.save(book);
        replaceBookCategories(savedBook, request.getCategoryIds());
        replaceBookAuthors(savedBook, request.getAuthorIds());
        upsertInventory(savedBook, request.getQuantity());

        return mapToResponse(savedBook.getId());
    }

    @Transactional
    public AdminBookResponse updateBook(Long bookId, AdminBookUpsertRequest request) {
        Book book = getActiveBookOrThrow(bookId);
        applyCommonFields(book, request);
        Book savedBook = bookRepository.save(book);

        replaceBookCategories(savedBook, request.getCategoryIds());
        replaceBookAuthors(savedBook, request.getAuthorIds());
        upsertInventory(savedBook, request.getQuantity());

        return mapToResponse(savedBook.getId());
    }

    @Transactional
    public void softDeleteBook(Long bookId) {
        Book book = getBookOrThrow(bookId);
        if (Boolean.TRUE.equals(book.getIsDeleted())) {
            return;
        }
        book.setIsDeleted(true);
        book.setIsActive(false);
        bookRepository.save(book);
    }

    @Transactional(readOnly = true)
    public AdminBookResponse getBookDetail(Long bookId) {
        return mapToResponse(bookId);
    }

    @Transactional(readOnly = true)
    public AdminBookPageResponse getBooks(int page,
                                          int size,
                                          String keyword,
                                          Long categoryId,
                                          Long authorId,
                                          Boolean includeDeleted) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(100, size));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        String normalizedKeyword = normalizeKeyword(keyword);
        Page<Book> result = bookRepository.findAdminBooks(
                normalizedKeyword,
                categoryId,
                authorId,
                includeDeleted,
                pageable
        );

        List<AdminBookResponse> content = result.getContent().stream()
                .map(book -> mapBookToResponse(book, inventoryRepository.findById(book.getId()).orElse(null)))
                .toList();

        return new AdminBookPageResponse(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalPages(),
                result.getTotalElements()
        );
    }

    private Book getBookOrThrow(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    private Book getActiveBookOrThrow(Long bookId) {
        Book book = getBookOrThrow(bookId);
        if (Boolean.TRUE.equals(book.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found");
        }
        return book;
    }

    private AdminBookResponse mapToResponse(Long bookId) {
        Book book = getBookOrThrow(bookId);
        Inventory inventory = inventoryRepository.findById(book.getId()).orElse(null);
        return mapBookToResponse(book, inventory);
    }

    private AdminBookResponse mapBookToResponse(Book book, Inventory inventory) {
        List<String> categories = book.getBookCategories().stream()
                .map(Bookcategory::getCategoryID)
                .filter(category -> category != null && !Boolean.TRUE.equals(category.getIsDeleted()))
                .map(Category::getCategoryName)
                .distinct()
                .sorted(String::compareToIgnoreCase)
                .toList();

        List<String> authors = book.getBookAuthors().stream()
                .map(Bookauthor::getAuthorID)
                .filter(author -> author != null && !Boolean.TRUE.equals(author.getIsDeleted()))
                .map(Author::getAuthorName)
                .distinct()
                .sorted(String::compareToIgnoreCase)
                .toList();

        Integer quantity = inventory != null && inventory.getQuantity() != null ? inventory.getQuantity() : 0;

        return new AdminBookResponse(
                book.getId(),
                book.getTitle(),
                book.getSlug(),
                book.getIsbn(),
                book.getDescription(),
                book.getPrice(),
                quantity,
                book.getSoldCount(),
                book.getPublisherID() != null ? book.getPublisherID().getPublisherName() : null,
                book.getPublishYear(),
                book.getLanguage(),
                Boolean.TRUE.equals(book.getIsActive()),
                Boolean.TRUE.equals(book.getIsDeleted()),
                book.getCreatedAt(),
                categories,
                authors
        );
    }

    private void applyCommonFields(Book book, AdminBookUpsertRequest request) {
        String normalizedTitle = request.getTitle().trim();
        if (normalizedTitle.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }

        book.setTitle(normalizedTitle);
        book.setSlug(generateSlug(normalizedTitle));
        book.setIsbn(trimToNull(request.getIsbn()));
        book.setDescription(trimToNull(request.getDescription()));
        book.setPrice(sanitizePrice(request.getPrice()));
        book.setPublishYear(request.getPublishYear());
        book.setLanguage(trimToNull(request.getLanguage()));

        if (request.getIsActive() != null) {
            book.setIsActive(request.getIsActive());
        } else if (book.getIsActive() == null) {
            book.setIsActive(true);
        }

        if (request.getPublisherId() != null) {
            Publisher publisher = publisherRepository.findById(request.getPublisherId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Publisher not found"));
            book.setPublisherID(publisher);
        } else {
            book.setPublisherID(null);
        }
    }

    private void replaceBookCategories(Book book, List<Long> categoryIds) {
        bookCategoryRepository.deleteByBookID_Id(book.getId());

        List<Long> normalizedCategoryIds = normalizeDistinctIds(categoryIds);
        if (normalizedCategoryIds.isEmpty()) {
            return;
        }

        List<Category> categories = categoriesRepository.findAllById(normalizedCategoryIds).stream()
                .filter(category -> !Boolean.TRUE.equals(category.getIsDeleted()))
                .toList();

        if (categories.size() != normalizedCategoryIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more categories are invalid");
        }

        List<Bookcategory> mappings = new ArrayList<>();
        for (Category category : categories) {
            Bookcategory mapping = new Bookcategory();
            BookcategoryId mappingId = new BookcategoryId();
            mappingId.setBookid(book.getId());
            mappingId.setCategoryid(Math.toIntExact(category.getId()));
            mapping.setId(mappingId);
            mapping.setBookID(book);
            mapping.setCategoryID(category);
            mappings.add(mapping);
        }

        bookCategoryRepository.saveAll(mappings);
    }

    private void replaceBookAuthors(Book book, List<Long> authorIds) {
        bookAuthorRepository.deleteByBookID_Id(book.getId());

        List<Long> normalizedAuthorIds = normalizeDistinctIds(authorIds);
        if (normalizedAuthorIds.isEmpty()) {
            return;
        }

        List<Author> authors = authorRepository.findByIdIn(normalizedAuthorIds).stream()
                .filter(author -> !Boolean.TRUE.equals(author.getIsDeleted()))
                .toList();

        if (authors.size() != normalizedAuthorIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more authors are invalid");
        }

        List<Bookauthor> mappings = new ArrayList<>();
        for (Author author : authors) {
            Bookauthor mapping = new Bookauthor();
            BookauthorId mappingId = new BookauthorId();
            mappingId.setBookid(book.getId());
            mappingId.setAuthorid(author.getId());
            mapping.setId(mappingId);
            mapping.setBookID(book);
            mapping.setAuthorID(author);
            mappings.add(mapping);
        }

        bookAuthorRepository.saveAll(mappings);
    }

    private void upsertInventory(Book book, Integer quantity) {
        int safeQuantity = quantity != null ? Math.max(0, quantity) : 0;
        Inventory inventory = inventoryRepository.findById(book.getId()).orElseGet(() -> {
            Inventory newInventory = new Inventory();
            newInventory.setId(book.getId());
            newInventory.setBookID(book);
            newInventory.setReserved(0);
            return newInventory;
        });

        inventory.setQuantity(safeQuantity);
        if (inventory.getReserved() == null) {
            inventory.setReserved(0);
        }
        inventoryRepository.save(inventory);
    }

    private BigDecimal sanitizePrice(BigDecimal price) {
        if (price == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price is required");
        }
        if (price.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be >= 0");
        }
        return price;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<Long> normalizeDistinctIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        Set<Long> normalized = new LinkedHashSet<>();
        for (Long id : ids) {
            if (id == null || id <= 0) {
                continue;
            }
            normalized.add(id);
        }
        return normalized.stream().sorted(Comparator.naturalOrder()).toList();
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String trimmed = keyword.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String generateSlug(String title) {
        String lower = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        String cleaned = NON_ALNUM_PATTERN.matcher(lower).replaceAll("-")
                .replaceAll("^-+", "")
                .replaceAll("-+$", "");
        return cleaned.isBlank() ? "book" : cleaned;
    }
    // --- ADMIN BOOK MANAGEMENT END: service layer for admin book CRUD/filter APIs ---
}
