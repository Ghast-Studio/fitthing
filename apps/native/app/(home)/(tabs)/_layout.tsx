import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
    return (
        <NativeTabs>
            <NativeTabs.Trigger name="index">
                <Label>Home</Label>
                <Icon sf="house.fill" drawable="custom_android_drawable" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="exercises">
                <Label>Übungen</Label>
                <Icon sf="figure.strengthtraining.traditional" drawable="custom_android_drawable" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile">
                <Label>Profil</Label>
                <Icon sf="person.fill" drawable="custom_android_drawable" />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}