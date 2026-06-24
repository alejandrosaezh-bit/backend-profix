import re

with open('src/screens/LoginScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    } catch (error) {
      console.error("handleSubmit error:", error);
      // Mostrar error en la UI en lugar de usar Alert que puede cerrarse
      setErrorMessage(error.message || 'Error de autenticación');
      // Doble confirmación visual
      // Alert.alert("Error de Registro", error.message || 'Error desconocido');
    }"""

replacement = """    } catch (error) {
      console.error("handleSubmit error:", error);
      
      const errorMsg = error.message || 'Error de autenticación';
      setErrorMessage(errorMsg);
      
      // Mostrar alerta visual para que sea imposible ignorarla
      Alert.alert(
        isRegistering ? "Error de Registro" : "Atención", 
        errorMsg,
        [{ text: 'Entendido' }]
      );

      // Limpiar solo la contraseña por seguridad y para que reintente, pero mantener el email
      if (!isRegistering) {
        setPassword('');
      }
    }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/screens/LoginScreen.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patch applied")
else:
    print("Target not found")
