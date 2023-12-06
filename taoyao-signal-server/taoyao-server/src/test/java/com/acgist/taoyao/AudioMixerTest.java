package com.acgist.taoyao;

import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.jupiter.api.Test;

public class AudioMixerTest {

    @Test
    public void testMixer() throws IOException {
//      ffmpeg -i audio.mp3 -f s32le audio.pcm
//      ffplay -i audio.pcm -f s32le -ar 48000 -ac 1
        final File fileA = new File("C:\\Users\\acgis\\桌面\\1.pcm");
        final File fileB = new File("C:\\Users\\acgis\\桌面\\2.pcm");
        final byte[] bytesA = Files.readAllBytes(fileA.toPath());
        final byte[] bytesB = Files.readAllBytes(fileB.toPath());
        final int length = Math.min(bytesA.length, bytesB.length);
        final byte[] target = new byte[length];
        final ByteBuffer buffer = ByteBuffer.allocateDirect(2);
        for (int i = 0; i < length; i += 2) {
            buffer.clear();
            buffer.put(bytesA[i + 1]);
            buffer.put(bytesA[i]);
            buffer.flip();
            int mixA = buffer.getShort();
            buffer.flip();
            buffer.put(bytesB[i + 1]);
            buffer.put(bytesB[i]);
            buffer.flip();
            int mixB = buffer.getShort();
            int mix = mixA + mixB;
            if(mix > Short.MAX_VALUE) {
                mix = Short.MAX_VALUE;
            }
            if(mix < Short.MIN_VALUE) {
                mix = Short.MIN_VALUE;
            }
            // 不能使用下面这个
//          mix = mix & 0xFFFF;
            buffer.flip();
            buffer.putShort((short) mix);
            buffer.flip();
            target[i + 1] = buffer.get();
            target[i]     = buffer.get();
        }
        Files.write(Paths.get("C:\\Users\\acgis\\桌面\\3.pcm"), target);
    }
    
}
