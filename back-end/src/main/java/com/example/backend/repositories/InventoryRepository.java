package com.example.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.entities.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    @Modifying
    @Query(value = """
            INSERT INTO dbo.inventories (bookid, quantity, reserved)
            VALUES (:bookId, :quantity, :reserved)
            ON CONFLICT (bookid) DO UPDATE
            SET quantity = EXCLUDED.quantity,
                reserved = COALESCE(dbo.inventories.reserved, EXCLUDED.reserved, 0)
            """, nativeQuery = true)
    int upsertInventory(@Param("bookId") Long bookId,
                        @Param("quantity") Integer quantity,
                        @Param("reserved") Integer reserved);
}
