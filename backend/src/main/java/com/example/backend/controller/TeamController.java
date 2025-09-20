package com.example.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.example.backend.model.Team;
import com.example.backend.model.TeamMember;
import com.example.backend.model.User;
import com.example.backend.model.Task;
import com.example.backend.repository.TeamRepository;
import com.example.backend.repository.TeamMemberRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.TaskRepository;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        return userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // 測試端點
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("TeamController is working!");
    }

    // 建立團隊
    @PostMapping
    public ResponseEntity<?> createTeam(@RequestBody Map<String, String> request) {
        try {
            User currentUser = getCurrentUser();

            Team team = new Team();
            team.setName(request.get("name"));
            team.setDescription(request.get("description"));
            team.setCreatedBy(currentUser);

            Team savedTeam = teamRepository.save(team);

            // 建立者自動成為 OWNER
            TeamMember ownerMember = new TeamMember();
            ownerMember.setTeam(savedTeam);
            ownerMember.setUser(currentUser);
            ownerMember.setRole(TeamMember.Role.OWNER);
            teamMemberRepository.save(ownerMember);

            return ResponseEntity.ok(savedTeam);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create team: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // 取得用戶參與的所有團隊
    @GetMapping
    public ResponseEntity<List<Team>> getUserTeams() {
        try {
            User currentUser = getCurrentUser();

            // 獲取用戶作為成員的所有 TeamMember 記錄
            List<TeamMember> userMemberships = teamMemberRepository.findByUser(currentUser);

            // 從這些記錄中提取團隊
            List<Team> teams = userMemberships.stream()
                    .map(TeamMember::getTeam)
                    .distinct()
                    .collect(Collectors.toList());

            return ResponseEntity.ok(teams);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    // 取得單個團隊資訊
    @GetMapping("/{teamId}")
    public ResponseEntity<?> getTeam(@PathVariable Long teamId) {
        try {
            User currentUser = getCurrentUser();
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));

            // 檢查用戶是否為團隊成員
            if (teamMemberRepository.findByTeamAndUser(team, currentUser).isEmpty()) {
                return ResponseEntity.status(403).body("Access denied");
            }

            return ResponseEntity.ok(team);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // 取得團隊成員
    @GetMapping("/{teamId}/members")
    public ResponseEntity<?> getTeamMembers(@PathVariable Long teamId) {
        try {
            User currentUser = getCurrentUser();
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));

            // 檢查用戶是否為團隊成員
            if (teamMemberRepository.findByTeamAndUser(team, currentUser).isEmpty()) {
                return ResponseEntity.status(403).body("Access denied");
            }

            List<TeamMember> members = teamMemberRepository.findByTeam(team);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // 邀請成員加入團隊
    @PostMapping("/{teamId}/members")
    public ResponseEntity<?> inviteMember(@PathVariable Long teamId, @RequestBody Map<String, String> request) {
        try {
            User currentUser = getCurrentUser();
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));

            // 檢查當前用戶是否有權限（OWNER 或 ADMIN）
            TeamMember currentMember = teamMemberRepository.findByTeamAndUser(team, currentUser)
                    .orElseThrow(() -> new RuntimeException("You are not a member of this team"));

            if (currentMember.getRole() != TeamMember.Role.OWNER &&
                    currentMember.getRole() != TeamMember.Role.ADMIN) {
                return ResponseEntity.status(403).body("Insufficient permissions");
            }

            // 找到要邀請的用戶
            String username = request.get("username");
            User userToInvite = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found: " + username));

            // 檢查用戶是否已經是團隊成員
            if (teamMemberRepository.findByTeamAndUser(team, userToInvite).isPresent()) {
                return ResponseEntity.badRequest().body("User is already a member");
            }

            // 建立新成員
            TeamMember newMember = new TeamMember();
            newMember.setTeam(team);
            newMember.setUser(userToInvite);
            newMember.setRole(TeamMember.Role.MEMBER);

            TeamMember savedMember = teamMemberRepository.save(newMember);
            return ResponseEntity.ok(savedMember);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // 取得團隊任務
    @GetMapping("/{teamId}/tasks")
    public ResponseEntity<?> getTeamTasks(@PathVariable Long teamId) {
        try {
            User currentUser = getCurrentUser();
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));

            // 檢查用戶是否為團隊成員
            if (teamMemberRepository.findByTeamAndUser(team, currentUser).isEmpty()) {
                return ResponseEntity.status(403).body("Access denied");
            }

            List<Task> tasks = taskRepository.findByTeam(team);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // 建立團隊任務
    @PostMapping("/{teamId}/tasks")
    public ResponseEntity<?> createTeamTask(@PathVariable Long teamId, @RequestBody Task task) {
        try {
            User currentUser = getCurrentUser();
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));

            // 檢查用戶是否為團隊成員
            if (teamMemberRepository.findByTeamAndUser(team, currentUser).isEmpty()) {
                return ResponseEntity.status(403).body("Access denied");
            }

            task.setUser(currentUser); // 建立者
            task.setTeam(team); // 所屬團隊

            if (task.getStatus() == null || task.getStatus().isEmpty()) {
                task.setStatus("todo");
            }

            if (task.getAssignee() == null || task.getAssignee().isEmpty()) {
                task.setAssignee(currentUser.getUsername());
            }

            Task savedTask = taskRepository.save(task);
            return ResponseEntity.ok(savedTask);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // 移除團隊成員
    @DeleteMapping("/{teamId}/members/{memberId}")
    public ResponseEntity<?> removeMember(@PathVariable Long teamId, @PathVariable Long memberId) {
        try {
            User currentUser = getCurrentUser();
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));

            // 檢查當前用戶是否有權限
            TeamMember currentMember = teamMemberRepository.findByTeamAndUser(team, currentUser)
                    .orElseThrow(() -> new RuntimeException("You are not a member of this team"));

            if (currentMember.getRole() != TeamMember.Role.OWNER &&
                    currentMember.getRole() != TeamMember.Role.ADMIN) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Insufficient permissions");
                return ResponseEntity.status(403).body(errorResponse);
            }

            // 找到要移除的成員
            TeamMember memberToRemove = teamMemberRepository.findById(memberId)
                    .orElseThrow(() -> new RuntimeException("Member not found"));

            // 不能移除團隊擁有者
            if (memberToRemove.getRole() == TeamMember.Role.OWNER) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Cannot remove team owner");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            teamMemberRepository.delete(memberToRemove);

            // 返回 JSON 格式的成功響應
            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("message", "Member removed successfully");
            successResponse.put("removedMemberId", memberId.toString());
            return ResponseEntity.ok(successResponse);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // 刪除團隊
    @DeleteMapping("/{teamId}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long teamId) {
        try {
            User currentUser = getCurrentUser();
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));

            // 只有團隊擁有者可以刪除團隊
            TeamMember currentMember = teamMemberRepository.findByTeamAndUser(team, currentUser)
                    .orElseThrow(() -> new RuntimeException("You are not a member of this team"));

            if (currentMember.getRole() != TeamMember.Role.OWNER) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Only team owner can delete the team");
                return ResponseEntity.status(403).body(errorResponse);
            }

            // 檢查團隊是否有未完成的任務
            List<Task> teamTasks = taskRepository.findByTeam(team);
            long incompleteTasks = teamTasks.stream()
                    .filter(task -> !"done".equals(task.getStatus()))
                    .count();

            if (incompleteTasks > 0) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Cannot delete team with incomplete tasks. Complete or reassign "
                        + incompleteTasks + " tasks first.");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // 刪除所有團隊成員關係
            List<TeamMember> members = teamMemberRepository.findByTeam(team);
            teamMemberRepository.deleteAll(members);

            // 刪除所有團隊任務（已完成的任務）
            taskRepository.deleteAll(teamTasks);

            // 刪除團隊
            teamRepository.delete(team);

            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("message", "Team deleted successfully");
            successResponse.put("deletedTeamId", teamId.toString());
            return ResponseEntity.ok(successResponse);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error deleting team: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}