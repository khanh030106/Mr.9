package com.example.backend.exceptions;

public class ExistEmailException extends RuntimeException {
    public ExistEmailException(String message) {
        super(message);
    }
}
