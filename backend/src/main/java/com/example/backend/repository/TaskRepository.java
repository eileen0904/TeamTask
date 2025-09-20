package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.backend.model.Task;
import com.example.backend.model.Team;
import com.example.backend.model.User;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    // 個人任務
    List<Task> findByUser(User user);

    // 團隊任務
    List<Task> findByTeam(Team team);

    // 混合查詢：包括個人任務和用戶所屬團隊的任務
    @Query("SELECT t FROM Task t WHERE t.user = :user OR t.team IN " +
            "(SELECT tm.team FROM TeamMember tm WHERE tm.user = :user)")
    List<Task> findTasksByUserIncludingTeams(@Param("user") User user);

    // 個人任務（不包括團隊任務）
    List<Task> findByUserAndTeamIsNull(User user);
}