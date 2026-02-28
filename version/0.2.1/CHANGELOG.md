# NoteAI Version Changelog

This file tracks what was added or improved in each packaged Windows version.

## 0.2.1

- Focus module patch:
  - fixed auto-restart behavior (countdown now stops at zero)
  - added stopwatch mode
  - added alarm sound when a countdown session completes
  - added alarm settings (enable/disable + volume)
  - improved Focus UI with tabbed timer/stopwatch flow and progress ring

## 0.2.0

- Consolidated feature release:
  - semantic search across modules
  - To-Do kanban + smart snooze + templates
  - TimeMap unscheduled task drag-and-drop
  - AI quick actions in chat
  - Notes templates + version diff
  - Focus mode (Pomodoro)
  - cloud conflict strategy (`merge` / `latest`) and offline retry improvements
- Documentation update:
  - root `README.md` refreshed for NoteAI
  - version changelog structure standardized

## 0.1.9

- Added semantic search for To-Do, Notes, TimeMap, Chat, and Command Palette
- Added To-Do Kanban view with drag-and-drop columns
- Added smart snooze actions in To-Do (`+5m`, `+1h`, `tomorrow`)
- Added To-Do templates for faster task creation
- Improved TimeMap with unscheduled task drag-and-drop
- Added AI chat quick actions:
  - convert response to task
  - save response as note
  - summarize + tag to note
- Added Notes templates
- Added Notes version diff preview (line by line)
- Added Focus mode (Pomodoro) module
- Added cloud conflict strategy (`merge` / `latest`) in settings
- Improved cloud sync retry behavior for offline/online transitions
- Added `focus` section support in Discord RPC presence

## 0.1.8

- Added/updated app icon pipeline and packaging resources
- Added cloud sync and cloud backup UX improvements
- Added settings cleanup and terminology improvements
- Added menu bar hiding behavior in Electron window

## 0.1.7

- Added updated Windows setup build outputs under `version/0.1.7`
- Packaging updates for app naming and installer artifact consistency

## 0.1.6

- Added AI chat/settings stabilization updates
- Added Firebase/service-account based configuration updates
- Added desktop app flow improvements and bug fixes

## 0.1.5

- Initial packaged desktop baseline with core modules:
  - To-Do
  - Notes
  - AI Chat
  - Settings
