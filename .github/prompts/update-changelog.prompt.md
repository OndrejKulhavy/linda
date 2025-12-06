# Update Changelog Prompt

Use this prompt when you need to update the CHANGELOG.md file with recent changes.

---

## Prompt

Please update the CHANGELOG.md file with the latest changes:

1. **Check recent git commits** - Look at commits since the last changelog entry date
2. **Analyze the changes**:
   - If there are fewer than 10 commits, review the actual code changes in detail
   - For each commit, understand what was modified (not just the commit message)
   - Identify the true impact and purpose of each change
3. **Categorize changes** appropriately:
   - **Added** - New features, components, pages, or functionality
   - **Enhanced** - Improvements to existing features
   - **Changed** - Changes in existing functionality
   - **Fixed** - Bug fixes
   - **Removed** - Removed features or files
   - **Security** - Security-related changes
   - **Updated** - Dependency updates
4. **Write clear, user-focused entries**:
   - Describe what the change does for the user/developer
   - Be specific but concise
   - Group related changes together
   - Include commit hashes for reference
5. **Update the date** in the changelog to today's date
6. **Update the `latestChangeDate`** in `/app/page.tsx` to match the new changelog date so the "What's New" badge appears for users

---

## Example Usage

Just say: "Update the changelog with recent changes" or "Add today's commits to the changelog"

The assistant will:
- Run `git log` to find recent commits
- Examine code diffs for detailed understanding
- Update CHANGELOG.md with properly categorized entries
- Update the date in page.tsx to show the badge
