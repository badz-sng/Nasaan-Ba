jest.mock('expo-router', () => ({ router: { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
import { createElement } from 'react';
import { Alert, Modal, Share } from 'react-native';
import { ActionButton } from './ActionButton';
import { SupportModal, supportDetails } from './SupportModal';

jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
const { act, create } = require('react-test-renderer');

test('support modal closes, shares the APK link, and recovers from share errors', async () => {
  const onClose = jest.fn();
  const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.dismissedAction });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  let tree: any;
  try {
    await act(async () => { tree = create(createElement(SupportModal, { visible: true, onClose })); });
    expect(tree.root.findByType(Modal).props.visible).toBe(true);
    tree.root.findByType(Modal).props.onRequestClose();
    expect(onClose).toHaveBeenCalled();
    const button = () => tree.root.findAllByType(ActionButton).find((node: any) => node.props.children === 'Share the app');
    await act(async () => { await button().props.onPress(); });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining(supportDetails.apkUrl) }));
    share.mockRejectedValueOnce(new Error('Share unavailable'));
    await act(async () => { await button().props.onPress(); });
    expect(alert).toHaveBeenCalled();
    expect(button().props.disabled).toBe(false);
  } finally {
    if (tree) await act(async () => tree.unmount());
    jest.restoreAllMocks();
  }
});
