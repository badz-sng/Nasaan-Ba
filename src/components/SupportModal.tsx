import { useState } from 'react';
import { Alert, Image, Modal, ScrollView, Share, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, colors } from './ActionButton';

// Supply the owner's actual QR asset and public APK link before distributing.
export const supportDetails: { qrImage: ImageSourcePropType | null; accountLabel: string; apkUrl: string } = {
  qrImage: require('../../support-me-qr.png'),
  accountLabel: '',
  apkUrl: 'https://drive.google.com/drive/folders/1XC7Cl-jMU8T9UlZQdvjNf2ZMt7mc4Bp7?usp=sharing',
};

export function SupportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [sharing, setSharing] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  async function shareApp() {
    setSharing(true);
    try {
      await Share.share({
        message: 'Try Nasaan ba? — a free app to help you organize your belongings and remember where you put them! ' +
          (supportDetails.apkUrl ? `Get the Android APK here: ${supportDetails.apkUrl}` : 'For now, the app is available through APK sharing. Ask the person who shared this for the APK, and pass it along to your friends!') +
          '\n\nWant to help bring the app to Google Play? Visit More > Support me in the app. Sharing it with a friend helps too. Thanks for the support!',
      });
    } catch {
      Alert.alert('Could not share', 'Please try again, or send the APK directly to a friend.');
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>Support me</Text>
            <ActionButton variant="link" onPress={onClose} accessibilityLabel="Close support modal">Close</ActionButton>
          </View>
          <Text style={styles.heading}>Help bring Nasaan ba? to Google Play</Text>
          <Text style={styles.body}>Hey! I built this app to make it easier to keep track of our stuff. For now, you can get it through APK sharing while I save up to publish it on Google Play and keep making it better.</Text>
          <View style={styles.donation}>
            <Text style={styles.sectionTitle}>Buy me a little building time</Text>
            <Text style={styles.body}>If you feel like chipping in, any amount helps cover publishing costs and gives me more time to work on the app. No pressure at all — the app is free to use either way!</Text>
            {supportDetails.qrImage && !qrFailed ? (
              <>
                <Image source={supportDetails.qrImage} resizeMode="contain" style={styles.qr} accessibilityLabel="Donation payment QR code" onError={() => setQrFailed(true)} />
                {!!supportDetails.accountLabel && <Text selectable style={styles.account}>{supportDetails.accountLabel}</Text>}
                <Text style={styles.caption}>Scan with your payment app and check the recipient before sending.</Text>
              </>
            ) : (
              <View style={styles.pending}><Text style={styles.caption}>{qrFailed ? 'The donation QR could not load. Please try again later.' : 'Donation QR coming soon. In the meantime, sharing the app is a great way to help!'}</Text></View>
            )}
          </View>
          <Text style={styles.sectionTitle}>Spread the word</Text>
          <Text style={styles.body}>Know someone who is always asking where they left something? Send them the app! Share it with your friends and family so more people can give it a try. Thanks for being part of this!</Text>
          <ActionButton onPress={shareApp} disabled={sharing}>{sharing ? 'Opening share…' : 'Share the app'}</ActionButton>
          <Text style={styles.caption}>{supportDetails.apkUrl ? 'The APK download link is included in your shared message.' : 'This shares a message. Send the APK file separately using your favorite file-sharing app.'}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, flex: 1 },
  heading: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, lineHeight: 23, color: colors.muted },
  donation: { padding: 16, gap: 12, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  qr: { width: '100%', aspectRatio: 1, backgroundColor: '#FFFFFF' },
  account: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: colors.text },
  caption: { fontSize: 13, lineHeight: 20, color: colors.muted, textAlign: 'center' },
  pending: { padding: 24, borderRadius: 8, backgroundColor: '#E8F7F5' },
});
