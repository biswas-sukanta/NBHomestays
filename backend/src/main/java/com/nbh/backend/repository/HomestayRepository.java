package com.nbh.backend.repository;

import com.nbh.backend.model.Homestay;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HomestayRepository extends JpaRepository<Homestay, UUID>, HomestayRepositoryCustom {

    List<Homestay> findByStatus(Homestay.Status status);

    List<Homestay> findByOwner(com.nbh.backend.model.User owner);

}
