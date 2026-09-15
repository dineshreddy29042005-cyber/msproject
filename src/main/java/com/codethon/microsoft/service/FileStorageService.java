package com.codethon.microsoft.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }

        String storedName = UUID.randomUUID() + extension;
        Path targetPath = uploadPath.resolve(storedName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return storedName;
    }

    public Path getFilePath(String storedFilename) {
        return Paths.get(uploadDir).toAbsolutePath().normalize().resolve(storedFilename);
    }

    public void deleteFile(String storedFilename) throws IOException {
        Path filePath = getFilePath(storedFilename);
        Files.deleteIfExists(filePath);
    }

    public String readFileContent(String storedFilename) throws IOException {
        Path filePath = getFilePath(storedFilename);
        return Files.readString(filePath);
    }
}
