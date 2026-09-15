package com.codethon.microsoft.service;

import com.codethon.microsoft.dto.DocumentDto;
import com.codethon.microsoft.entity.Document;
import com.codethon.microsoft.entity.User;
import com.codethon.microsoft.repository.DocumentRepository;
import com.codethon.microsoft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final AnalysisService analysisService;

    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
    );

    public DocumentDto uploadDocument(MultipartFile file, String title) throws IOException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("File type not supported. Allowed: PDF, DOCX, TXT");
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must not exceed 10 MB");
        }

        String storedFilename = fileStorageService.storeFile(file);
        String filePath = fileStorageService.getFilePath(storedFilename).toString();

        Document document = Document.builder()
                .title(title != null && !title.isBlank() ? title : file.getOriginalFilename())
                .originalFilename(file.getOriginalFilename())
                .storedFilename(storedFilename)
                .filePath(filePath)
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .status(Document.DocumentStatus.PENDING)
                .user(user)
                .build();

        document = documentRepository.save(document);

        // Kick off async analysis
        analysisService.analyzeDocumentAsync(document.getId());

        return mapToDto(document);
    }

    public List<DocumentDto> getMyDocuments() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return documentRepository.findByUserIdOrderByUploadedAtDesc(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public DocumentDto getDocumentById(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));
        return mapToDto(document);
    }

    public void deleteDocument(Long id) throws IOException {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));

        fileStorageService.deleteFile(document.getStoredFilename());
        documentRepository.delete(document);
    }

    private DocumentDto mapToDto(Document doc) {
        return DocumentDto.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .originalFilename(doc.getOriginalFilename())
                .fileSize(doc.getFileSize())
                .fileType(doc.getFileType())
                .status(doc.getStatus().name())
                .uploadedAt(doc.getUploadedAt())
                .username(doc.getUser().getUsername())
                .build();
    }
}
