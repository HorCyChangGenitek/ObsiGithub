## ADDED Requirements

### Requirement: Non-intrusive State Mapping
The system SHALL maintain a mapping between local files and remote GitHub containers without modifying the source Markdown files.

#### Scenario: New Publication
- **WHEN** a note is successfully uploaded
- **THEN** verify if `data.json` has an entry for this file path
- **AND** if not, generate a **NanoID** (10 chars, `a-zA-Z0-9`)
- **AND** save `{ "local/path/to/note.md": "nano-id" }` to `fileMap` in `data.json`
- **AND** set persistence status to `'published'` in `fileStatus`

#### Scenario: Re-publishing
- **WHEN** a note is published again
- **THEN** look up the ID from `data.json` using the file path
- **AND** use the existing ID to overwrite files in the specific GitHub folder
- **AND** update persistence status to `'published'`

### Requirement: Persistent Status Tracking
The system SHALL maintain the last known remote status to optimize API usage and UI responsiveness.

#### Scenario: Status Updates
- **WHEN** a file is published -> Status = `'published'`
- **WHEN** a file is unshared (remote delete) -> Status = `'unshared'`
- **WHEN** a status check is performed -> Status updated based on API result (`'published'` or `'unshared'`)
