package com.sqstools.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "preferences")
public class PreferenceEntity {

    @Id
    private String key;

    @Column(nullable = false)
    private String value;

    public PreferenceEntity() {
    }

    public PreferenceEntity(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
