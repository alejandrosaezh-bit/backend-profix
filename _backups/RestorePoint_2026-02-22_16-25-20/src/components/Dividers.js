import { View } from 'react-native';

export const SectionDivider = () => (
    <View style={{
        height: 8,
        backgroundColor: 'transparent',
        width: '100%',
    }} />
);

export const HandDrawnDivider = () => <SectionDivider />;
