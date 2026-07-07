package contract

import (
	"regexp"
	"strconv"
	"strings"
)

// CmpVersion compares semver-ish versions. Its ordering is a frozen, shared ABI:
// it is a faithful port of `compareLauncherVersions` in
// @open-design/launcher-proto, so the Go launcher and the TypeScript updater
// agree on version precedence (Q4 conformance). Existing behaviour must never be
// reordered — only extended. Rules: numeric core `X.Y.Z`; a `X.Y.Z.nightly.N`
// form; a release (no prerelease) sorts ABOVE a prerelease; numeric prerelease
// identifiers sort below alphanumeric ones; a shorter prerelease list sorts first.
func CmpVersion(a, b string) int {
	left := parseComparable(a)
	right := parseComparable(b)
	for i := 0; i < 3; i++ {
		if left.nums[i] != right.nums[i] {
			if left.nums[i] < right.nums[i] {
				return -1
			}
			return 1
		}
	}
	if len(left.pre) == 0 && len(right.pre) == 0 {
		return 0
	}
	if len(left.pre) == 0 {
		return 1
	}
	if len(right.pre) == 0 {
		return -1
	}
	max := len(left.pre)
	if len(right.pre) > max {
		max = len(right.pre)
	}
	for i := 0; i < max; i++ {
		if i >= len(left.pre) {
			return -1
		}
		if i >= len(right.pre) {
			return 1
		}
		if d := compareIdentifier(left.pre[i], right.pre[i]); d != 0 {
			return d
		}
	}
	return 0
}

type parsedVersion struct {
	nums [3]int
	pre  []string
}

var (
	digitsRe  = regexp.MustCompile(`^[0-9]+$`)
	nightlyRe = regexp.MustCompile(`(?i)^(\d+)\.(\d+)\.(\d+)\.nightly\.(\d+)$`)
)

func parseComparable(value string) parsedVersion {
	cleaned := strings.TrimSpace(value)
	if len(cleaned) > 0 && (cleaned[0] == 'v' || cleaned[0] == 'V') {
		cleaned = cleaned[1:]
	}
	cleaned = strings.SplitN(cleaned, "+", 2)[0]
	if m := nightlyRe.FindStringSubmatch(cleaned); m != nil {
		return parsedVersion{nums: [3]int{atoi(m[1]), atoi(m[2]), atoi(m[3])}, pre: []string{"nightly", m[4]}}
	}
	core := cleaned
	pre := ""
	if i := strings.IndexByte(cleaned, '-'); i >= 0 {
		core = cleaned[:i]
		pre = cleaned[i+1:]
	}
	parts := strings.Split(core, ".")
	part := func(i int) string {
		if i < len(parts) {
			return parts[i]
		}
		return ""
	}
	var preList []string
	if len(pre) > 0 {
		preList = strings.Split(pre, ".")
	}
	return parsedVersion{nums: [3]int{numberPart(part(0)), numberPart(part(1)), numberPart(part(2))}, pre: preList}
}

func numberPart(s string) int {
	if !digitsRe.MatchString(s) {
		return 0
	}
	return atoi(s)
}

func compareIdentifier(a, b string) int {
	aNum := digitsRe.MatchString(a)
	bNum := digitsRe.MatchString(b)
	if aNum && bNum {
		x, y := atoi(a), atoi(b)
		switch {
		case x < y:
			return -1
		case x > y:
			return 1
		default:
			return 0
		}
	}
	if aNum {
		return -1
	}
	if bNum {
		return 1
	}
	return sign(strings.Compare(a, b))
}

func atoi(s string) int {
	n, _ := strconv.Atoi(s)
	return n
}

func sign(n int) int {
	switch {
	case n < 0:
		return -1
	case n > 0:
		return 1
	default:
		return 0
	}
}
