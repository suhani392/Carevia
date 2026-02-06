import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface NameBlockProps {
    name?: string;
}

const NameBlock = ({ name }: NameBlockProps) => {
    return (
        <View style={styles.block}>
            {name ? <Text style={styles.text}>{name}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    block: {
        width: 335,
        height: 60,
        backgroundColor: '#D9E8FF',
        borderRadius: 15,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    text: {
        fontSize: 18,
        color: '#000000',
        fontFamily: 'Judson-Regular',
    }
});

export default NameBlock;
