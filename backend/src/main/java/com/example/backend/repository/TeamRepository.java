package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.backend.model.Team;
import com.example.backend.model.User;
import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByCreatedBy(User createdBy);

    @Query("SELECT t FROM Team t JOIN t.members tm WHERE tm.user = :user")
    List<Team> findTeamsByUser(@Param("user") User user);
}
