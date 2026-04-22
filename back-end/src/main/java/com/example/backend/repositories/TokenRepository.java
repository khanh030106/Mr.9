package com.example.backend.repositories;

import com.example.backend.entities.Emailverificationtoken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;


public interface TokenRepository extends JpaRepository<Emailverificationtoken, Long> {

    Optional<Emailverificationtoken> findByToken(String token);

    @Modifying
    @Query("UPDATE Emailverificationtoken t SET t.isUsed = true WHERE t.user.id = :userId AND t.isUsed = false")
    void markAllUnusedTokensAsUsedByUserId(@Param("userId") Long userId);

}
