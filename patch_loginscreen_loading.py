import re

with open('src/screens/LoginScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const { login, register, isLoading } = useContext(AuthContext);", "const { login, register, isAuthLoading } = useContext(AuthContext);")
content = content.replace("disabled={isLoading}", "disabled={isAuthLoading}")
content = content.replace("{isLoading ?", "{isAuthLoading ?")

with open('src/screens/LoginScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("LoginScreen patched to use isAuthLoading")
