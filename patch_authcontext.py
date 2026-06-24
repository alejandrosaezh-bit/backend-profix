import re

with open('src/context/AuthContext.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add isAuthLoading state
content = content.replace(
    "const [isLoading, setIsLoading] = useState(true);",
    "const [isLoading, setIsLoading] = useState(true);\n    const [isAuthLoading, setIsAuthLoading] = useState(false);"
)

# Replace setIsLoading(true) inside login/register with setIsAuthLoading(true)
content = re.sub(
    r'const login = async \((.*?)\) => \{\n\s+setIsLoading\(true\);',
    r'const login = async (\1) => {\n        setIsAuthLoading(true);',
    content
)
content = re.sub(
    r'\} catch \(error\) \{\n\s+// console.error\("Login error:", error\);\n\s+throw error;\n\s+\} finally \{\n\s+setIsLoading\(false\);',
    r'} catch (error) {\n            // console.error("Login error:", error);\n            throw error;\n        } finally {\n            setIsAuthLoading(false);',
    content
)

content = re.sub(
    r'const register = async \((.*?)\) => \{\n\s+setIsLoading\(true\);',
    r'const register = async (\1) => {\n        setIsAuthLoading(true);',
    content
)
content = re.sub(
    r'\} catch \(error\) \{\n\s+console.error\("Register error:", error\);\n\s+throw error;\n\s+\} finally \{\n\s+setIsLoading\(false\);',
    r'} catch (error) {\n            console.error("Register error:", error);\n            throw error;\n        } finally {\n            setIsAuthLoading(false);',
    content
)

content = re.sub(
    r'const googleLogin = async \((.*?)\) => \{\n\s+setIsLoading\(true\);',
    r'const googleLogin = async (\1) => {\n        setIsAuthLoading(true);',
    content
)
content = re.sub(
    r'\} catch \(error\) \{\n\s+console.error\("Google Login error:", error\);\n\s+throw error;\n\s+\} finally \{\n\s+setIsLoading\(false\);',
    r'} catch (error) {\n            console.error("Google Login error:", error);\n            throw error;\n        } finally {\n            setIsAuthLoading(false);',
    content
)

# Export isAuthLoading
content = content.replace(
    "login, register, googleLogin, logout, updateUser, isLoading, userToken, userInfo",
    "login, register, googleLogin, logout, updateUser, isLoading, isAuthLoading, userToken, userInfo"
)

with open('src/context/AuthContext.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("AuthContext patched")
