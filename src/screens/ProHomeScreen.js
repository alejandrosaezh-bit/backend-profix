import { FlatList, RefreshControl, View } from 'react-native';
import {
    ProCategoryFilterModal,
    ProEmptyStateNoCategories, ProEmptyStateNoOffers,
    ProHomeHeader,
    ProJobCard,
    ProLoader
} from '../components/home/ProHomeComponents';

export default function ProHomeScreen({
    activeCategories,
    showFilterBar,
    setShowFilterBar,
    showArchivedOffers,
    setShowArchivedOffers,
    filterCategory,
    setFilterCategory,
    categoryModalVisible,
    setCategoryModalVisible,
    jobsWithStatus,
    refreshing,
    onRefresh,
    availableJobsForPro,
    spin,
    setView,
    getProStatusColor,
    handleOpenJobDetail
}) {
    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {/* HEADER AZUL & MODALS */}
            <ProHomeHeader
                showFilterBar={showFilterBar} setShowFilterBar={setShowFilterBar}
                showArchivedOffers={showArchivedOffers} setShowArchivedOffers={setShowArchivedOffers}
                activeCategoriesLength={activeCategories.length}
                setCategoryModalVisible={setCategoryModalVisible}
                filterCategory={filterCategory}
            />

            <ProCategoryFilterModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                jobsWithStatus={jobsWithStatus}
            />

            <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 8, paddingBottom: 100 }}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={availableJobsForPro.length === 0 ? ['transparent'] : ['#2563EB']}
                        tintColor={availableJobsForPro.length === 0 ? 'transparent' : '#2563EB'}
                    />
                }
                data={availableJobsForPro}
                keyExtractor={(item) => item.id || item._id}
                ListEmptyComponent={
                    refreshing ? (
                        <ProLoader spin={spin} />
                    ) : activeCategories.length === 0 ? (
                        <ProEmptyStateNoCategories setView={setView} />
                    ) : (
                        <ProEmptyStateNoOffers showArchivedOffers={showArchivedOffers} setView={setView} />
                    )
                }
                renderItem={({ item: job }) => {
                    const totalUnread = (job.conversations || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
                    const isNewJob = job.proInteractionStatus === 'new' || job.proInteractionHasUnread === true;

                    return (
                        <ProJobCard
                            job={job}
                            isNewJob={isNewJob}
                            getProStatusColor={getProStatusColor}
                            handleOpenJobDetail={handleOpenJobDetail}
                        />
                    );
                }}
            />
        </View>
    );
}
