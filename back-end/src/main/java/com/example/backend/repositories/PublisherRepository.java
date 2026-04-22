package com.example.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.entities.Publisher;

public interface PublisherRepository extends JpaRepository<Publisher, Long> {
	@Query("""
	SELECT p FROM Publisher p
	WHERE COALESCE(p.isDeleted, false) = false
	  AND LOWER(CAST(p.publisherName AS string)) = LOWER(CAST(:publisherName AS string))
	""")
	Optional<Publisher> findByPublisherNameIgnoreCaseAndIsDeletedFalse(@Param("publisherName") String publisherName);

	@Query("""
	SELECT p FROM Publisher p
	WHERE COALESCE(p.isDeleted, false) = false
	ORDER BY p.publisherName ASC
	""")
	List<Publisher> findAllActiveOrderByName();
}
