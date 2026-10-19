import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { saveToLibraryAsync, usePermissions } from 'expo-media-library';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TelaCamera />
    </SafeAreaProvider>
  );
}

function TelaCamera() {
  const [permissaoCamera, solicitarPermissaoCamera] = useCameraPermissions();
  const [permissaoGaleria, solicitarPermissaoGaleria] = usePermissions();
  const [salvando, setSalvando] = useState(false);
  const [cameraAtiva, setCameraAtiva] = useState(true);
  const camera = useRef(null);

  const carregandoPermissoes =
    permissaoCamera == null || permissaoGaleria == null;

  const temPermissao =
    Boolean(permissaoCamera?.granted) && Boolean(permissaoGaleria?.granted);

  async function pedirPermissoes() {
    try {
      if (permissaoCamera && !permissaoCamera.granted && !permissaoCamera.canAskAgain) {
        Alert.alert(
          'Permissão necessária',
          'Ative o acesso à câmera nas configurações do aplicativo.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const cameraResult = permissaoCamera?.granted
        ? permissaoCamera
        : await solicitarPermissaoCamera();

      if (!cameraResult.granted) return;

      if (permissaoGaleria && !permissaoGaleria.granted && !permissaoGaleria.canAskAgain) {
        Alert.alert(
          'Permissão necessária',
          'Permita que o aplicativo salve fotos na galeria pelas configurações.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      await solicitarPermissaoGaleria();
    } catch (error) {
      Alert.alert('Não foi possível solicitar as permissões', 'Tente novamente nas configurações do aparelho.');
    }
  }

  async function tirarFoto() {
    if (!camera.current || salvando) return;

    setSalvando(true);
    try {
      const foto = await camera.current.takePictureAsync({ quality: 0.85 });
      await saveToLibraryAsync(foto.uri);
      Alert.alert('Foto salva!', 'A imagem foi salva na sua galeria.');
    } catch (error) {
      console.error('Erro ao tirar ou salvar foto:', error);
      Alert.alert('Ops!', 'Não foi possível salvar a foto. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregandoPermissoes) {
    return (
      <SafeAreaView style={styles.centro}>
        <ActivityIndicator size="large" color="#D71920" />
        <Text style={styles.textoCarregando}>Preparando sua câmera...</Text>
      </SafeAreaView>
    );
  }

  if (!temPermissao) {
    return (
      <SafeAreaView style={styles.telaPermissao}>
        <View style={styles.marcaIcone}>
          <Text style={styles.marcaIconeTexto}>C</Text>
        </View>
        <Text style={styles.tituloPermissao}>Sua câmera,{'\n'}do seu jeito.</Text>
        <Text style={styles.descricaoPermissao}>
          Para tirar fotos e salvá-las no aparelho, precisamos de acesso à câmera e à galeria.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.botaoPrincipal}
          onPress={pedirPermissoes}
          activeOpacity={0.85}
        >
          <Text style={styles.textoBotaoPrincipal}>Permitir acesso</Text>
        </TouchableOpacity>
        <Text style={styles.notaPermissao}>Suas fotos ficam no seu dispositivo.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.cabecalho}>
        <View style={styles.marcaIconePequeno}>
          <Text style={styles.marcaIconeTextoPequeno}>C</Text>
        </View>
        <View style={styles.cabecalhoTextos}>
          <Text style={styles.nomeApp}>CAPTURA</Text>
          <Text style={styles.subtituloApp}>O momento é seu.</Text>
        </View>
        <View style={styles.status}>
          <View style={styles.pontoStatus} />
          <Text style={styles.textoStatus}>PRONTA</Text>
        </View>
      </View>

      <View style={styles.areaCamera}>
        {cameraAtiva ? (
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            mode="picture"
          />
        ) : (
          <View style={styles.cameraPausada}>
            <Text style={styles.cameraPausadaTitulo}>Câmera pausada</Text>
            <Text style={styles.cameraPausadaTexto}>Toque em retomar para continuar.</Text>
          </View>
        )}

        {cameraAtiva && (
          <View pointerEvents="none" style={styles.moldura}>
            <View style={[styles.canto, styles.cantoSuperiorEsquerdo]} />
            <View style={[styles.canto, styles.cantoSuperiorDireito]} />
            <View style={[styles.canto, styles.cantoInferiorEsquerdo]} />
            <View style={[styles.canto, styles.cantoInferiorDireito]} />
          </View>
        )}

        <View style={styles.etiquetaCamera}>
          <View style={styles.pontoVermelho} />
          <Text style={styles.etiquetaTexto}>CÂMERA AO VIVO</Text>
        </View>
      </View>

      <View style={styles.painelInferior}>
        <View style={styles.instrucao}>
          <Text style={styles.tituloInstrucao}>Pronto para capturar?</Text>
          <Text style={styles.descricaoInstrucao}>Enquadre o momento e toque no botão.</Text>
        </View>

        <View style={styles.controles}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={cameraAtiva ? 'Pausar câmera' : 'Retomar câmera'}
            style={styles.botaoSecundario}
            onPress={() => setCameraAtiva((ativa) => !ativa)}
            disabled={salvando}
            activeOpacity={0.8}
          >
            <Text style={styles.iconeSecundario}>{cameraAtiva ? 'Ⅱ' : '▶'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Tirar foto"
            style={[styles.botaoCaptura, (!cameraAtiva || salvando) && styles.botaoDesativado]}
            onPress={tirarFoto}
            disabled={!cameraAtiva || salvando}
            activeOpacity={0.85}
          >
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.mioloCaptura} />
            )}
          </TouchableOpacity>

          <View style={styles.dicaLateral}>
            <Text style={styles.dicaLateralTexto}>HD</Text>
            <Text style={styles.dicaLateralLegenda}>QUALIDADE</Text>
          </View>
        </View>

        <View style={styles.rodape}>
          <View style={styles.linhaRodape} />
          <Text style={styles.textoRodape}>SIMPLES. RÁPIDO. SEU.</Text>
          <View style={styles.linhaRodape} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const VERMELHO = '#D71920';
const VERMELHO_ESCURO = '#B51219';
const BRANCO = '#FFFFFF';
const PRETO = '#171717';
const CINZA = '#777777';
const FUNDO = '#F7F7F7';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRANCO,
  },
  centro: {
    flex: 1,
    backgroundColor: BRANCO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCarregando: {
    marginTop: 14,
    color: CINZA,
    fontSize: 14,
  },
  telaPermissao: {
    flex: 1,
    backgroundColor: BRANCO,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  marcaIcone: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: VERMELHO,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  marcaIconeTexto: {
    color: BRANCO,
    fontSize: 30,
    fontWeight: '900',
  },
  tituloPermissao: {
    color: PRETO,
    fontSize: 38,
    lineHeight: 43,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  descricaoPermissao: {
    color: CINZA,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 28,
    maxWidth: 340,
  },
  botaoPrincipal: {
    backgroundColor: VERMELHO,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },
  textoBotaoPrincipal: {
    color: BRANCO,
    fontSize: 16,
    fontWeight: '700',
  },
  notaPermissao: {
    color: CINZA,
    textAlign: 'center',
    marginTop: 18,
    fontSize: 12,
  },
  cabecalho: {
    minHeight: 76,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  marcaIconePequeno: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: VERMELHO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaIconeTextoPequeno: {
    color: BRANCO,
    fontSize: 23,
    fontWeight: '900',
  },
  cabecalhoTextos: {
    marginLeft: 12,
    flex: 1,
  },
  nomeApp: {
    color: PRETO,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  subtituloApp: {
    color: CINZA,
    fontSize: 12,
    marginTop: 3,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  pontoStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: VERMELHO,
    marginRight: 7,
  },
  textoStatus: {
    color: VERMELHO_ESCURO,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  areaCamera: {
    flex: 1,
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 10,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#202020',
  },
  moldura: {
    ...StyleSheet.absoluteFillObject,
    margin: 22,
  },
  canto: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  cantoSuperiorEsquerdo: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 7,
  },
  cantoSuperiorDireito: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 7,
  },
  cantoInferiorEsquerdo: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 7,
  },
  cantoInferiorDireito: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 7,
  },
  etiquetaCamera: {
    position: 'absolute',
    top: 18,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  pontoVermelho: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: VERMELHO,
    marginRight: 7,
  },
  etiquetaTexto: {
    color: BRANCO,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cameraPausada: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#202020',
  },
  cameraPausadaTitulo: {
    color: BRANCO,
    fontSize: 20,
    fontWeight: '700',
  },
  cameraPausadaTexto: {
    color: '#D0D0D0',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  painelInferior: {
    backgroundColor: BRANCO,
    paddingHorizontal: 26,
    paddingTop: 12,
    paddingBottom: 10,
  },
  instrucao: {
    alignItems: 'center',
  },
  tituloInstrucao: {
    color: PRETO,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  descricaoInstrucao: {
    color: CINZA,
    fontSize: 13,
    marginTop: 6,
  },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  botaoSecundario: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9E9E9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRANCO,
  },
  iconeSecundario: {
    color: PRETO,
    fontSize: 21,
    fontWeight: '700',
  },
  botaoCaptura: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: VERMELHO,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#F9D7D8',
    elevation: 4,
    shadowColor: VERMELHO,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  botaoDesativado: {
    opacity: 0.55,
  },
  mioloCaptura: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: VERMELHO,
    borderWidth: 3,
    borderColor: BRANCO,
  },
  dicaLateral: {
    width: 54,
    alignItems: 'center',
  },
  dicaLateralTexto: {
    color: VERMELHO,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dicaLateralLegenda: {
    color: CINZA,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  linhaRodape: {
    height: 1,
    flex: 1,
    backgroundColor: '#EEEEEE',
  },
  textoRodape: {
    color: '#A0A0A0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.7,
  },
});