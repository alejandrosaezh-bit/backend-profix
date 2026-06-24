import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# We can just remove the lines that redefine those keys at the bottom.
# The warning says:
#  1489:5   error    Duplicate key 'modalOverlay'
#  1493:5   error    Duplicate key 'headerTop'
#  1494:5   error    Duplicate key 'headerTitle'
#  1495:5   error    Duplicate key 'logoutIconButtonHeader'

lines = content.split('\n')
keys_to_remove = ['modalOverlay:', 'headerTop:', 'headerTitle:', 'logoutIconButtonHeader:']

for i in range(len(lines)):
    if i > 1400: # only remove at the bottom
        for key in keys_to_remove:
            if lines[i].strip().startswith(key):
                lines[i] = '// ' + lines[i] # comment them out instead

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print("Fixed duplicate styles")
