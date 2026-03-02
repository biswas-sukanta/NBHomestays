#!/bin/bash

# Dependency Compatibility Check Script
# This script validates that no major version upgrades are present without explicit approval

echo "🔍 Checking for major version dependency changes..."

# Check for major version changes in critical dependencies
CRITICAL_DEPS=(
    "okhttp3"
    "okio"
    "jackson"
    "spring-boot"
    "jwt"
    "hibernate"
)

MAJOR_VERSION_CHANGES=0

for dep in "${CRITICAL_DEPS[@]}"; do
    echo "Checking $dep..."
    
    # Look for major version changes in pom.xml
    if grep -q "$dep" pom.xml; then
        # Extract current version
        current_version=$(grep -A 2 "$dep" pom.xml | grep "<version>" | sed 's/.*<version>\(.*\)<\/version>.*/\1/' | head -1)
        
        if [ -n "$current_version" ]; then
            echo "  $dep version: $current_version"
            
            # Check if this is a major version (first digit changed)
            major_version=$(echo "$current_version" | cut -d. -f1)
            
            # Flag major versions that might be problematic
            case $dep in
                "okhttp3")
                    if [ "$major_version" != "4" ]; then
                        echo "  🚨 WARNING: OkHttp version $current_version may not be compatible with ImageKit SDK"
                        MAJOR_VERSION_CHANGES=$((MAJOR_VERSION_CHANGES + 1))
                    fi
                    ;;
                "okio")
                    if [ "$major_version" != "3" ]; then
                        echo "  🚨 WARNING: Okio version $current_version may have compatibility issues"
                        MAJOR_VERSION_CHANGES=$((MAJOR_VERSION_CHANGES + 1))
                    fi
                    ;;
                "jackson")
                    if [ "$major_version" != "2" ]; then
                        echo "  🚨 WARNING: Jackson major version change detected"
                        MAJOR_VERSION_CHANGES=$((MAJOR_VERSION_CHANGES + 1))
                    fi
                    ;;
                "jwt")
                    if [ "$major_version" != "0" ]; then
                        echo "  🚨 WARNING: JWT major version change detected"
                        MAJOR_VERSION_CHANGES=$((MAJOR_VERSION_CHANGES + 1))
                    fi
                    ;;
            esac
        fi
    fi
done

echo ""
echo "📊 Summary:"
echo "Major version changes detected: $MAJOR_VERSION_CHANGES"

if [ $MAJOR_VERSION_CHANGES -gt 0 ]; then
    echo ""
    echo "❌ MAJOR VERSION CHANGES DETECTED"
    echo "Please review these changes carefully:"
    echo "1. Verify compatibility with all dependent libraries"
    echo "2. Run integration tests with all external SDKs"
    echo "3. Get explicit approval for major version upgrades"
    echo ""
    echo "To bypass this check (if approved), set ALLOW_MAJOR_VERSION_CHANGES=true"
    exit 1
else
    echo ""
    echo "✅ No critical major version changes detected"
    exit 0
fi
