package com.example.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "roles", schema = "dbo")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roleid", nullable = false)
    private Long id;

    @NotNull
    @Column(name = "rolename", nullable = false, length = Integer.MAX_VALUE)
    private String roleName;

    @OneToMany(mappedBy = "roleID")
    private Set<Userrole> userRoles = new LinkedHashSet<>();


}