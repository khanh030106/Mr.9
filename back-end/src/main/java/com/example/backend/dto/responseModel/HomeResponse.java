package com.example.backend.dto.responseModel;

import com.example.backend.dto.interfaces.BookInfo;
import lombok.Data;
import org.springframework.data.domain.Page;


@Data
public class HomeResponse {
    private Page<BookInfo> top10SoldOutBooks;
    private Page<BookInfo> promotionBooks;
    private Page<BookInfo> activeBooks;
}
