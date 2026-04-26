# Data Model Documentation

This document describes the data model for the LTI (Learning Tracking Initiative) application, including entity descriptions, field definitions, relationships, and an entity-relationship diagram.

## Model Descriptions

### Database 
- Simple SQL

### 1. users
Represents The user signed up in the web

**Fields:**
managed by Laravel Sanctum

### 2. activity_types
- `id`: Unique identifier (CHAR36)
- `user_id`: ???
- `name`: ???
- `description`: ???
- `icon_key`: ???
- `display_order`: ???
- `created_at`: ???

### 2. activities
- `id`: Unique identifier (CHAR36)  
- `user_id`: ???
- `name`: ???
- `address`: ???
- `lat`: ???
- `lng`: ???
- `phone`: ???
- `notes`: ???
- `tags JSON`: ???
- `is_favorite`: ???
- `created_at`: ???
- `updated_at`: ???
- `last_viewed_at`: ???

### 3. activity_activity_type
- `activity_id`: ???
- `activity_type_id`: ???
— pivot M:N

### 4. reviews
- `id`: Unique identifier (CHAR36) 
- `activity_id`: ??? 
- `activity_type_id`: ??? 
- `user_id`: ??? 
- `score_location`: ??? 
- `score_food`: ??? 
- `score_service`: ??? 
- `score_price`: ??? 
- `cost_per_person`: ??? 
- `liked`: ??? 
- `disliked`: ??? 
- `notes`: ??? 
- `created_at`: ??? 
- `updated_at`: ???
— `UNIQUE`: (activity_id, user_id, activity_type_id)

### 5. activity_photos
- `id`: Unique identifier (CHAR36) 
- `activity_id`: ???
- `storage_path`: ???
- `display_order`: ???
- `created_at`: ???