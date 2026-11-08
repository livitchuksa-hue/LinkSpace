package ru.linkspace.service;

import java.util.List;
import org.springframework.stereotype.Service;
import ru.linkspace.dto.RegionRequest;
import ru.linkspace.exception.ResourceNotFoundException;
import ru.linkspace.model.Region;
import ru.linkspace.repository.RegionRepository;

@Service
public class RegionService {

    private final RegionRepository regionRepository;

    public RegionService(RegionRepository regionRepository) {
        this.regionRepository = regionRepository;
    }

    public List<Region> findAll() {
        return regionRepository.findAll();
    }

    public Region findById(Long id) {
        return regionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Region not found: " + id));
    }

    public Region create(RegionRequest request) {
        Region region = new Region();
        region.setName(request.getName());
        region.setColor(request.getColor());
        region.setCoordinates(request.getCoordinates());
        return regionRepository.insert(region);
    }

    public Region update(Long id, RegionRequest request) {
        Region existing = findById(id);
        existing.setName(request.getName());
        existing.setColor(request.getColor());
        existing.setCoordinates(request.getCoordinates());
        return regionRepository.update(existing);
    }

    public void delete(Long id) {
        if (!regionRepository.deleteById(id)) {
            throw new ResourceNotFoundException("Region not found: " + id);
        }
    }
}
