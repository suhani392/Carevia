import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useAppContext } from '../../context/AppContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0;

const AppStatusBar = () => {
    const { colors, themeMode } = useAppContext();
    const bgColor = colors.headerGradient[0] || '#0155FF';

    return (
        <View style={[styles.statusBar, { backgroundColor: bgColor }]}>
            <StatusBar
                backgroundColor={bgColor}
                barStyle="light-content"
                hidden={false}
                translucent={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    statusBar: {
        height: STATUS_BAR_HEIGHT,
        width: '100%',
        position: 'relative',
        zIndex: 9999,
    },
});

export default AppStatusBar;
