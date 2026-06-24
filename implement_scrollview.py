import re

with open('src/screens/ProfessionalProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the PanResponder stuff
pan_start = "const panResponder = useRef("
if pan_start in content:
    pan_idx = content.find(pan_start)
    pan_end_idx = content.find(").current;", pan_idx) + 10
    content = content[:pan_idx] + content[pan_end_idx:]

# Find where ProfessionalProfileView is rendered
target_render_start = "<View style={{ flex: 1 }} {...panResponder.panHandlers}>"
if target_render_start in content:
    target_render_end = "</ProfessionalProfileView>\n            </View>"
    target_idx = content.find(target_render_start)
    target_end_idx = content.find(target_render_end, target_idx) + len(target_render_end)
    
    scroll_view_code = """
        <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1, backgroundColor: '#F8FAFC' }}
            onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / Dimensions.get('window').width);
                if (activeCategories[index]) {
                    setSelectedCategory(activeCategories[index]);
                }
            }}
        >
            {activeCategories.length > 0 ? activeCategories.map((cat, index) => {
                const catKey = cat.fullName || cat.name;
                const catRealProfile = getProfile(catKey);
                const catCurrentProfile = catRealProfile || { bio: '', subcategories: [], gallery: [], zones: [] };
                const catActiveColor = catCurrentProfile?.profileColor || '#2563EB';
                const catActiveTheme = catCurrentProfile?.profileTheme || profileData.profileTheme || 'social';
                const currentCatReviews = reviews.filter(r => r.category === catKey);
                
                return (
                    <View style={{ width: Dimensions.get('window').width, flex: 1 }} key={catKey}>
                        <ProfessionalProfileView
                            user={user}
                            profileData={profileData}
                            categoryKey={catKey}
                            isOwner={isOwner}
                            isPreviewMode={isPreviewMode}
                            activeTheme={catActiveTheme}
                            activeColor={catActiveColor}
                            catReviews={currentCatReviews}
                            categoryStats={categoryStats} // You might want to compute this per category, but let's keep it global for now or it was global anyway
                            combinedHistory={combinedHistory}
                            isLoadingProfile={isLoadingProfile}
                            onChat={handleChat}
                            onOffer={handleOffer}
                            onClose={onBack}
                            onChangeCategory={() => setIsCategorySelectionVisible(true)}
                            onEditProfile={() => {
                                setIsEditing(true);
                                setIsPreviewMode(false);
                            }}
                            onGamification={() => setIsGamificationVisible(true)}
                        >
                            {isOwner && !isPreviewMode && (
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
                        </ProfessionalProfileView>
                    </View>
                );
            }) : (
                <View style={{ width: Dimensions.get('window').width, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#64748B' }}>No tienes categorías activas.</Text>
                </View>
            )}
        </ScrollView>"""
        
    content = content[:target_idx] + scroll_view_code + content[target_end_idx:]

# Add scrollRef definition
if "const scrollRef = useRef(null);" not in content:
    content = content.replace(
        "const panResponder =", 
        "const scrollRef = useRef(null);\n\n    useEffect(() => {\n        if (scrollRef.current && activeCategories.length > 0) {\n            const index = activeCategories.findIndex(c => (c.fullName || c.name) === (selectedCategory?.fullName || selectedCategory?.name || selectedCategory));\n            if (index !== -1) {\n                scrollRef.current.scrollTo({ x: index * Dimensions.get('window').width, animated: true });\n            }\n        }\n    }, [selectedCategory, activeCategories.length]);\n\n    // const panResponder ="
    )

with open('src/screens/ProfessionalProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Implemented native ScrollView paging")
