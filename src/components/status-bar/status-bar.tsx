import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';

/**
 * A plain status bar component with #0155FF color.
 * Designed to be static and contains no text or icons.
 */
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0;

const AppStatusBar = () => {
    return (
        <View style={styles.statusBar}>
            <StatusBar
                backgroundColor="#0155FF"
                barStyle="light-content"
                hidden={false} // Showing the system icons (time, battery, etc.)
                translucent={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    statusBar: {
        height: STATUS_BAR_HEIGHT,
        backgroundColor: '#0155FF',
        width: '100%',
        position: 'relative',
        zIndex: 9999,
    },
});

export default AppStatusBar;
