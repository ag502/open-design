package state

import (
	"encoding/json"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
)

// ReadJSON reads and decodes a JSON document. A missing file returns
// (zero, false, nil) so callers can treat absence as genesis rather than error.
func ReadJSON[T any](path string) (T, bool, error) {
	var v T
	b, err := os.ReadFile(path)
	if errors.Is(err, fs.ErrNotExist) {
		return v, false, nil
	}
	if err != nil {
		return v, false, err
	}
	if err := json.Unmarshal(b, &v); err != nil {
		return v, false, err
	}
	return v, true, nil
}

// WriteJSON atomically writes v as pretty JSON: it writes a temp sibling then
// renames over the target, so a crash mid-write never leaves a torn document.
func WriteJSON(path string, v any) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	b = append(b, '\n')
	tmp, err := os.CreateTemp(filepath.Dir(path), ".tmp-*")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	if _, err := tmp.Write(b); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpName, path)
}

// RemoveIfExists deletes a file, treating "not found" as success.
func RemoveIfExists(path string) error {
	if err := os.Remove(path); err != nil && !errors.Is(err, fs.ErrNotExist) {
		return err
	}
	return nil
}
