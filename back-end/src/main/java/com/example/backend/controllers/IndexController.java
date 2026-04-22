package com.example.backend.controllers;

import com.example.backend.dto.responseModel.HomeResponse;
import com.example.backend.services.BookService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/home")
public class IndexController {
    private final BookService bookService;
    public IndexController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public HomeResponse getHomeDate(){
        HomeResponse res = new HomeResponse();
        res.setTop10SoldOutBooks(bookService.findTop10Books());
        res.setPromotionBooks(bookService.findTop10PromotionBooks());
        res.setActiveBooks(bookService.findAllBooksActive());
        return res;
    }
}
