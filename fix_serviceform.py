import re

with open('src/screens/ServiceForm.js', 'r') as f:
    content = f.read()

# Remove base64: true, from ImagePicker.launchImageLibraryAsync
content = content.replace("quality: 0.5,\n            base64: true,", "quality: 0.5,")

# Remove base64: true, from ImagePicker.launchCameraAsync
content = content.replace("quality: 0.5,\n            base64: true,\n            allowsEditing: false,", "quality: 0.5,\n            allowsEditing: false,")

with open('src/screens/ServiceForm.js', 'w') as f:
    f.write(content)
