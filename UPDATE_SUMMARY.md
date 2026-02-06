# Update Summary: Subcategories & Icons

## Changes
1. **Schema Update**: Categories now support detailed subcategories (Icon, Title Placeholder, Description Placeholder).
2. **Data Migration**: Existing subcategories were automatically converted to the new format.
3. **Admin Panel**:
   - New "Manage Subcategories" section in the Category Editor.
   - Expanded Icon Library (30+ icons including MaterialCommunityIcons).
   - Ability to set custom Placeholders for user requests.
4. **Client App**:
   - **Home Screen**: Forms now show dynamic placeholders based on selected subcategory.
   - **My Requests**: Displays subcategory icon if one is defined; otherwise falls back to category icon.

## How to Test
1. Go to Admin Panel > Categorías.
2. Edit "Hogar".
3. Add/Edit a subcategory (e.g. "Aire Acondicionado").
4. Set an Icon and Placeholders (e.g. Title: "Fallo en compresor").
5. Go to Home Screen in App.
6. Select Hogar > Aire Acondicionado.
7. Verify the input placeholders change.
