import re

with open('src/screens/LoginScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove showErrorPopup state and effects
content = re.sub(r'  const \[showErrorPopup, setShowErrorPopup\] = useState\(false\);\n\n  useEffect\(\(\) => \{\n    console.log\("LoginScreen mounted!"\);\n    return \(\) => console.log\("LoginScreen unmounted!"\);\n  \}, \[\]\);\n\n  useEffect\(\(\) => \{\n    console.log\("showErrorPopup changed to:", showErrorPopup\);\n  \}, \[showErrorPopup\]\);', '', content)

# Remove setShowErrorPopup(true)
content = content.replace('setShowErrorPopup(true);', '')

# Remove the ERROR OVERLAY block
overlay_pattern = r'      \{\/\* ERROR OVERLAY \*\/\}[\s\S]*?\{\/\* Modal de Recuperación \*\/\}'
content = re.sub(overlay_pattern, '      {/* Modal de Recuperación */}', content)

# Ensure the inline message says "Usuario o clave incorrectas"
content = content.replace("const errorMsg = error.message || 'Error de autenticación';", "const errorMsg = 'Usuario o contraseña incorrectos.';")

with open('src/screens/LoginScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted to inline error message")
