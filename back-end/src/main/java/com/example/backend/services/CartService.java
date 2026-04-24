package com.example.backend.services;

import com.example.backend.dto.requests.AddCartRequest;
import com.example.backend.dto.responseModel.CartItemResponse;
import com.example.backend.entities.*;
import com.example.backend.repositories.BookRepository;
import com.example.backend.repositories.CartItemRepository;
import com.example.backend.repositories.CartRepository;
import com.example.backend.repositories.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public CartService(CartItemRepository cartItemRepository,
                       CartRepository cartRepository,
                       UserRepository userRepository,
                       BookRepository bookRepository
    ) {
        this.cartItemRepository = cartItemRepository;
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    private Cart getOrCreateCart(User user){
        return cartRepository.findByUserID(user).orElseGet(() -> {
            Cart cart = new Cart();
            cart.setUserID(user);
            cart.setCreatedAt(OffsetDateTime.now());
            return cartRepository.save(cart);
        });
    }

    // --- BEGIN FIX: kiểm tra tồn kho khi thêm/cập nhật giỏ — revert: xóa availableUnits + assertWithinStock + các lời gọi ---
    private int availableUnits(Book book) {
        Inventory inv = book.getInventory();
        if (inv == null) {
            return 0;
        }
        int q = inv.getQuantity() != null ? inv.getQuantity() : 0;
        int r = inv.getReserved() != null ? inv.getReserved() : 0;
        return Math.max(0, q - r);
    }

    private void assertWithinStock(Book book, int desiredCartLineQuantity) {
        int avail = availableUnits(book);
        if (desiredCartLineQuantity > avail) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm không đủ hàng trong kho");
        }
    }
    // --- END FIX: kiểm tra tồn kho ---

    @Transactional
    public void addToCart(String email, AddCartRequest request){
        if (request.getBookId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bookId là bắt buộc");
        }
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quantity phải > 0");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại"));

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sách không tồn tại"));

        Cart cart = getOrCreateCart(user);

        Optional<Cartitem> existing = cartItemRepository.findByCartIDAndBookID(cart, book);
        int currentQty = existing.map(Cartitem::getQuantity).orElse(0);
        // --- BEGIN FIX: chặn thêm quá tồn — revert: xóa dòng assertWithinStock ---
        assertWithinStock(book, currentQty + request.getQuantity());
        // --- END FIX ---
        if(existing.isPresent()){
            Cartitem item = existing.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            cartItemRepository.save(item);
        } else {
            CartitemId id = new CartitemId();
            id.setCartid(cart.getId());
            id.setBookid(book.getId());

            Cartitem cartitem = new Cartitem();
            cartitem.setId(id);
            cartitem.setCartID(cart);
            cartitem.setBookID(book);
            cartitem.setQuantity(request.getQuantity());
            cartItemRepository.save(cartitem);
        }
    }

    @Transactional
    public Page<CartItemResponse> getCart(String email, int page, int pageSize) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page phải >= 0");
        }
        if (pageSize <= 0 || pageSize > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "size phải trong khoảng 1-50");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại"));
        Cart cart = cartRepository.findByUserID(user).orElse(null);

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "id.bookid"));

        if (cart == null) return Page.empty(pageable);

        return cartItemRepository.findByCartID(cart, pageable).map(this::toCartItemResponse);

    }

        private CartItemResponse toCartItemResponse (Cartitem item){
            Book book = item.getBookID();

            String imageUrl = book.getBookImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                    .map(Bookimage::getImageUrl)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);
            int discount = book.getPromotionBooks().stream()
                    .map(Promotionbook::getPromotionID)
                    .filter(Objects::nonNull)
                    .map(Promotion::getDiscountPercent)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(0);
            BigDecimal discountRate = BigDecimal.valueOf(1 - discount / 100.0);
            BigDecimal finalPrice = book.getPrice().multiply(discountRate);
            String authorName = book.getBookAuthors().stream()
                    .map(Bookauthor::getAuthorID)
                    .filter(Objects::nonNull)
                    .map(Author::getAuthorName)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse("Unknown");

        return new CartItemResponse(
                    book.getId(),
                    book.getTitle(),
                    imageUrl,
                    authorName,
                    book.getPrice(),
                    finalPrice,
                    discount,
                    item.getQuantity()
            );
    }

    @Transactional
    public void removeFromCart(String email, Long bookId){
        if (bookId == null || bookId < 0){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book ID không hợp lệ");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại"));

        Cart cart = cartRepository.findByUserID(user).orElse(null);

        if (cart == null)return;

        cartItemRepository.deleteByIdCartidAndIdBookid(cart.getId(), bookId);

    }

    @Transactional
    public void updateCartItemQuantity(String email, Long bookId, Integer quantity) {
        if (bookId == null || bookId < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book ID không hợp lệ");
        }
        if (quantity == null || quantity < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quantity phải >= 0");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại"));
        Cart cart = cartRepository.findByUserID(user).orElse(null);
        if (cart == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Giỏ hàng trống");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sách không tồn tại"));

        if (quantity == 0) {
            cartItemRepository.deleteByIdCartidAndIdBookid(cart.getId(), bookId);
            return;
        }

        Optional<Cartitem> existing = cartItemRepository.findByCartIDAndBookID(cart, book);
        if (existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sản phẩm không có trong giỏ");
        }
        Cartitem item = existing.get();
        assertWithinStock(book, quantity);
        item.setQuantity(quantity);
        cartItemRepository.save(item);
    }

}
