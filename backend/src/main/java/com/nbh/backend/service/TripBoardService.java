package com.nbh.backend.service;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.TripBoardSave;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.TripBoardSaveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TripBoardService {

    private final TripBoardSaveRepository tripBoardSaveRepository;
    private final HomestayRepository homestayRepository;

    /** Toggle save: returns true if now saved, false if removed. */
    @Transactional
    public boolean toggleSave(UUID homestayId, UUID userId) {
        // Verify homestay exists
        if (!homestayRepository.existsById(homestayId)) {
            throw new RuntimeException("Homestay not found: " + homestayId);
        }

        TripBoardSave.TripBoardPk pk = new TripBoardSave.TripBoardPk(userId, homestayId);
        if (tripBoardSaveRepository.existsById(pk)) {
            tripBoardSaveRepository.deleteById(pk);
            return false;
        } else {
            tripBoardSaveRepository.save(TripBoardSave.builder()
                    .userId(userId)
                    .homestayId(homestayId)
                    .build());
            return true;
        }
    }

    @Transactional(readOnly = true)
    public boolean isSaved(UUID homestayId, UUID userId) {
        return tripBoardSaveRepository.existsByUserIdAndHomestayId(userId, homestayId);
    }

    /**
     * Returns full homestay summaries for the user's board.
     * This is the server-side sync endpoint — the frontend Zustand store
     * is the source of truth offline, this syncs on login.
     */
    @Transactional(readOnly = true)
    public List<Homestay> getSavedHomestays(UUID userId) {
        List<UUID> savedIds = tripBoardSaveRepository.findHomestayIdsByUserId(userId);
        return homestayRepository.findAllById(savedIds);
    }

    @Transactional(readOnly = true)
    public List<UUID> getSavedHomestayIds(UUID userId) {
        return tripBoardSaveRepository.findHomestayIdsByUserId(userId);
    }
}
