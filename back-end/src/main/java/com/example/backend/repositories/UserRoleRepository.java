package com.example.backend.repositories;

import com.example.backend.entities.Userrole;
import com.example.backend.entities.UserroleId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<Userrole, UserroleId> {
}
