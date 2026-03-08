package com.nbh.backend.controller;

import com.nbh.backend.dto.DestinationCardDto;
import com.nbh.backend.dto.StateDto;
import com.nbh.backend.service.DestinationService;
import com.nbh.backend.service.StateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/states")
@RequiredArgsConstructor
public class StateController {

    private final StateService stateService;
    private final DestinationService destinationService;

    @GetMapping
    public ResponseEntity<List<StateDto>> getAllStates() {
        return ResponseEntity.ok(stateService.getAllStates());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<StateDto> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(stateService.getBySlug(slug));
    }

    @GetMapping("/{slug}/destinations")
    public ResponseEntity<List<DestinationCardDto>> getDestinationsByState(@PathVariable String slug) {
        return ResponseEntity.ok(destinationService.getDestinationsByStateSlug(slug));
    }
}
