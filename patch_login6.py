import re

with open('src/screens/LoginScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("setErrorMessage(''); // Limpiar errores previos", "// setErrorMessage(''); // Removed to test if this causes flashing")

with open('src/screens/LoginScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed setErrorMessage from top of handleSubmit")
