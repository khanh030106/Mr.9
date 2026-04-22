package com.example.backend.repositories;

import com.example.backend.entities.User;
import com.example.backend.entities.Useraddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<Useraddress, Long> {

    @Query("""
            select a from Useraddress a
            where a.userID = :user
              and (a.isDeleted = false or a.isDeleted is null)
            order by case when a.isDefault = true then 0 else 1 end, a.id desc
            """)
    List<Useraddress> findActiveByUser(@Param("user") User user);

    @Query("""
            select a from Useraddress a
            where a.id = :addressId
              and a.userID = :user
              and (a.isDeleted = false or a.isDeleted is null)
            """)
    Optional<Useraddress> findActiveByIdAndUser(@Param("addressId") Long addressId, @Param("user") User user);

    Optional<Useraddress> findTopByOrderByIdDesc();
}

