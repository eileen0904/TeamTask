package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.backend.model.TeamMember;
import com.example.backend.model.Team;
import com.example.backend.model.User;
import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeam(Team team);
    List<TeamMember> findByUser(User user);
    Optional<TeamMember> findByTeamAndUser(Team team, User user);
}