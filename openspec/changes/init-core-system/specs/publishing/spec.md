## ADDED Requirements

### Requirement: Containerized Path Structure
The system SHALL organize published content on GitHub using a UUID-based container structure to ensure privacy and link integrity.

#### Scenario: Publishing a new note
- **WHEN** a note is published for the first time
- **THEN** a new UUID is generated
- **AND** the note is uploaded to `/{UUID}/note.md`
- **AND** attachments are uploaded to `/{UUID}/[Assets_Folder]/[filename]`

### Requirement: Environment Validation
The system SHALL prevent publishing if the Obsidian environment configuration is incompatible.

#### Scenario: Wikilinks enabled
- **WHEN** user triggers publish
- **AND** Obsidian setting "Use [[Wikilinks]]" is ON
- **THEN** show an error notification
- **AND** abort the operation

#### Scenario: Absolute paths enabled
- **WHEN** user triggers publish
- **AND** Obsidian setting "New link format" is NOT "Relative path to file"
- **THEN** show an error notification
- **AND** abort the operation

### Requirement: Content Processing
The system SHALL transform the note content to be suitable for GitHub rendering.

#### Scenario: Title Injection
- **WHEN** processing the note content
- **THEN** extract the note's filename (without extension)
- **AND** insert it as an H1 (`# Title`) at the very first line of the content

#### Scenario: Attachment Link Resolution
- **WHEN** processing a note with image `![[image.png]]` or `![](image.png)`
- **THEN** resolve the local file system path
- **AND** convert the content link to `[Assets_Folder]/image.png` (relative to the note in the container)

### Requirement: Context Menu Integration
The system SHALL provide file-level actions via the Obsidian "File Menu".

#### Scenario: Dynamic Actions
- **WHEN** right-clicking a Markdown file
- **IF** file is NOT mapped (New) -> Show "**Publish to GitHub**"
- **IF** file IS mapped (Published) -> Show:
    - "**Update Share on GitHub**"
    - "**Check Remote Status**"
    - "**Copy GitHub Link**"
    - "**Remove Share from GitHub**" (Only if status is NOT `'unshared'`)

### Requirement: Management View
The system SHALL provide a centralized view for managing published notes.

#### Scenario: UI Components
- **List**: Display all mapped files with Path, UUID, and Status Icon.
- **Actions**:
    - **Open**: Open note on GitHub in browser.
    - **Copy**: Copy GitHub URL to clipboard.
    - **Unshare**: Delete remote files, update status to `'unshared'` (Local record kept).
    - **Forget**: Delete local record (Remote files untouched).
- **Check Status**:
    - Button to verify remote existence for all items.
    - **Cooldown**: Prevent frequent API calls (e.g., 30 seconds).
    - **Live Refresh**: Automatically reflect status changes in UI without manual reload.
