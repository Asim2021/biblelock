import { Text, View } from 'react-native';
import SafeAreaView from '@/components/SafeAreaView';

export default function Index() {
	return (
		<SafeAreaView>
			<View className='bg-white'>
				<Text className='text-xl font-bold text-blue-500'>Welcome Asim Shah!</Text>
			</View>
		</SafeAreaView>
	);
}
