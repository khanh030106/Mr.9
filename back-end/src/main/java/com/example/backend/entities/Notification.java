package com.example.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "notifications", schema = "dbo")
public class Notification {
    @Id
    @Column(name = "notificationid", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userid", nullable = false)
    private User userID;

    @Size(max = 255)
    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", length = Integer.MAX_VALUE)
    private String content;

    @Size(max = 50)
    @ColumnDefault("NULL")
    @Column(name = "type", length = 50)
    private String type;

    @ColumnDefault("false")
    @Column(name = "isread")
    private Boolean isRead;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "createdat")
    private OffsetDateTime createdAt;


}