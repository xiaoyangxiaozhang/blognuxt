#!/usr/bin/env bash
set -euo pipefail

revision="${1:-HEAD}"
subject="$(git log -1 --format=%s "$revision")"
body="$(git log -1 --format=%b "$revision")"
if [[ ! "$subject" =~ ^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\([a-zA-Z0-9._/-]+\))?(!)?:[[:space:]].+ ]]; then
  echo "Invalid commit subject: use <type>(optional-scope): <description>." >&2
  exit 1
fi
if [[ "$subject" =~ !: || "$body" =~ (^|$'\n')BREAKING[[:space:]-]CHANGE: ]]; then
  echo "Breaking changes require a manually planned major release." >&2
  exit 1
fi

stable_versions() {
  sed -nE 's/^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/\1.\2.\3/p'
}
# A deployment retry keeps the release already assigned to this exact commit.
existing="$(git tag --points-at "$revision" --sort=version:refname | stable_versions | tail -n 1)"
if [[ -n "$existing" ]]; then
  echo "v$existing"
  exit 0
fi
latest="$(git tag --list --sort=version:refname | stable_versions | tail -n 1)"
IFS=. read -r major minor patch <<< "${latest:-1.0.0}"
if [[ "$subject" =~ ^feat(\([a-zA-Z0-9._/-]+\))?: ]]; then
  minor=$((minor + 1))
  patch=0
else
  patch=$((patch + 1))
fi
echo "v${major}.${minor}.${patch}"
