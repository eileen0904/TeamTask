package com.example.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.example.backend.model.Task;
import com.example.backend.model.User;
import com.example.backend.model.Team;
import com.example.backend.repository.TaskRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.TeamRepository;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // 取得任務 - 支援多種模式
    @GetMapping
    public List<Task> getTasks(@RequestParam(required = false) Long userId,
            @RequestParam(required = false) String mode) {
        User currentUser = getCurrentUser();

        // 如果有指定 userId 且是當前用戶，使用指定用戶
        User targetUser = (userId != null && userId.equals(currentUser.getId()))
                ? currentUser
                : currentUser;

        if ("personal".equals(mode)) {
            // 只返回個人任務（不包括團隊任務）
            return taskRepository.findByUserAndTeamIsNull(targetUser);
        } else if ("all".equals(mode)) {
            // 返回所有任務（個人 + 團隊）
            return taskRepository.findTasksByUserIncludingTeams(targetUser);
        } else {
            // 預設：保持現有行為，返回用戶建立的所有任務（包括個人和團隊任務）
            return taskRepository.findByUser(targetUser);
        }
    }

    @PostMapping
    public Task addTask(@RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long teamId,
            @RequestBody Task task) {
        User currentUser = getCurrentUser();
        task.setUser(currentUser); // 設定建立者

        // 如果指定了團隊 ID，設定團隊
        if (teamId != null) {
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));
            task.setTeam(team);
        }

        if (task.getStatus() == null || task.getStatus().isEmpty()) {
            task.setStatus("todo");
        }

        // 如果沒有指定 assignee，預設為建立者
        if (task.getAssignee() == null || task.getAssignee().isEmpty()) {
            task.setAssignee(currentUser.getUsername());
        }

        return taskRepository.save(task);
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable Long id, @RequestBody Task body) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (body.getTitle() != null)
            task.setTitle(body.getTitle());
        if (body.getDescription() != null)
            task.setDescription(body.getDescription());
        if (body.getStatus() != null)
            task.setStatus(body.getStatus());
        if (body.getAssignee() != null)
            task.setAssignee(body.getAssignee());

        // 如果 body 中有 dueDate（包括 null），就更新它
        task.setDueDate(body.getDueDate());

        return taskRepository.save(task);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskRepository.deleteById(id);
    }

    // 取得用戶可見的所有任務（個人 + 參與團隊的任務）
    @GetMapping("/all")
    public List<Task> getAllAccessibleTasks() {
        User currentUser = getCurrentUser();
        return taskRepository.findTasksByUserIncludingTeams(currentUser);
    }

    // 只取得個人任務
    @GetMapping("/personal")
    public List<Task> getPersonalTasks() {
        User currentUser = getCurrentUser();
        return taskRepository.findByUserAndTeamIsNull(currentUser);
    }
}