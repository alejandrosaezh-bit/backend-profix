import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the block
start_marker = "    if (!isOwner || isPreviewMode) {"
end_marker = "            </ScrollView>"

start_idx = content.find(start_marker)
if start_idx == -1:
    print("Could not find start marker")
    exit(1)

# Find the LAST occurrence of `</ScrollView>` before `CrossProfileNotificationModal`
cross_idx = content.find("<CrossProfileNotificationModal", start_idx)
if cross_idx == -1:
    print("Could not find CrossProfileNotificationModal")
    exit(1)

end_idx = content.rfind(end_marker, start_idx, cross_idx)
if end_idx == -1:
    print("Could not find end marker")
    exit(1)

end_idx += len(end_marker)

replacement = """    return (
        <ProfessionalProfileView
            user={user}
            profileData={profileData}
            categoryKey={selectedCategory?.name || selectedCategory}
            isOwner={isOwner}
            isPreviewMode={isPreviewMode}
            activeTheme={activeTheme}
            activeColor={activeColor}
            catReviews={catReviews}
            categoryStats={categoryStats}
            combinedHistory={combinedHistory}
            isLoadingProfile={isLoadingProfile}
            isCategoryActive={isCategoryActive}
            onViewImage={setFullscreenImage}
            onViewGallery={setSelectedGallery}
            onContact={() => { /* Implementado desde el padre en RequestDetailClient */ }}
            onEditProfile={() => setIsProfileEditVisible(true)}
            onChangeCategory={() => setCategoryModalVisible(true)}
            onGamification={() => setIsGamificationVisible(true)}
            onClose={onBack}
        >
            {isOwner && (
                <ProAccountSettings
                    startEditingPersonal={startEditingPersonal}
                    handleResetApplicationData={handleResetApplicationData}
                    onSwitchMode={onSwitchMode}
                    onOpenSubscriptions={() => setIsSubscriptionsVisible(true)}
                    onOpenVerification={() => setIsVerificationVisible(true)}
                    onOpenNotifications={() => setShowNotifications(true)}
                    onOpenThemeSelector={() => setIsThemeSelectorVisible(true)}
                    onOpenPreview={() => setIsPreviewMode(true)}
                    otherModeCount={otherModeCount}
                    user={user}
                />
            )}

            {/* MODAL: SUBSCRIPCIONES */}
            <ProSubscriptionModal
                visible={isSubscriptionsVisible}
                onClose={() => setIsSubscriptionsVisible(false)}
                user={user}
            />

            {/* MODAL: GAMIFICACIÓN Y NIVELES */}
            <ProGamificationModal
                visible={isGamificationVisible}
                onClose={() => setIsGamificationVisible(false)}
                user={user}
            />

            {/* MODAL: SELECCIÓN DE CATEGORÍA */}
            <ProCategorySelectionModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                user={user}
                profileData={profileData}
                onCategoryAdded={handleCategoryAdded}
            />

            {/* MODAL: EDICIÓN DE DATOS PERSONALES */}
            <ProPersonalEditModal
                visible={isPersonalEditVisible}
                onClose={() => setIsPersonalEditVisible(false)}
                user={user}
                handleSavePersonal={handleSavePersonal}
            />

            {/* MODAL: EDICIÓN DEL PERFIL PROFESIONAL */}
            <ProProfileEditModal
                visible={isProfileEditVisible}
                onClose={() => setIsProfileEditVisible(false)}
                currentCatProfile={currentCatProfile}
                selectedCategory={selectedCategory}
                handleSaveProfile={handleSaveProfile}
            />

            {/* MODAL: SELECTOR DE TEMA Y COLOR */}
            <ProThemeSelectorModal
                visible={isThemeSelectorVisible}
                onClose={() => setIsThemeSelectorVisible(false)}
                currentCatProfile={currentCatProfile}
                handleSaveTheme={handleSaveTheme}
            />

            {/* MODAL: VERIFICACIÓN */}
            <ProVerificationModal
                visible={isVerificationVisible}
                onClose={() => setIsVerificationVisible(false)}
                user={user}
                handleSavePersonal={handleSavePersonal}
            />

            <NotificationPreferencesModal 
                visible={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                user={user}
                onUpdate={onUpdate}
                mode="pro"
            />
        </ProfessionalProfileView>
"""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced content.")
